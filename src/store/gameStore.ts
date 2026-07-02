import { create } from 'zustand'
import { ref, onValue, set as firebaseSet, update, push, get as firebaseGet, remove, runTransaction } from 'firebase/database'
import { db } from '../firebase'
import { generateAliases, matchAlias } from '../utils/wikiApi'
import type { InfoboxData } from '../utils/wikiApi'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export interface Player {
  id: string
  name: string
  avatarUrl?: string
  isHost: boolean
  isOnline: boolean
  score: number
  correct: number
  wrong: number
  selectorWins: number
}

export interface Question {
  id: string
  askerId: string
  askerName: string
  text: string
  answer: string
}

export interface Guess {
  id: string
  playerId: string
  playerName: string
  text: string
  correct: boolean
  status: 'pending' | 'correct' | 'wrong'
  isFirst: boolean
  matchType?: 'exact' | 'partial' | 'none'
}

export interface GameRoom {
  code: string
  name: string
  hostId: string
  status: 'waiting' | 'playing' | 'revealing' | 'ended'
  gameMode: 'timer' | 'qlimit'
  timerSeconds: number
  qLimit: number
  maxPlayers: number
  totalRounds: number
  currentRound: number
  roundStartedAt?: number | null
  selectorIndex: number
  selectorId?: string
  playerOrder?: string[]
  players: Record<string, Player>
  target: {
    name: string
    canonicalName?: string
    aliases?: string[]
    category: string
    source: string
    facts: Array<{ question: string; answer: string }>
    imageUrl?: string
    referenceExtract?: string
    referenceUrl?: string
    referenceFacts?: {
      alive?: boolean
      gender?: string
      occupations: string[]
      nationalities: string[]
      birthPlace?: string
      isFictional?: boolean
      infobox?: InfoboxData
    }
  } | null
  questions: Record<string, Question>
  guesses: Record<string, Guess>
  createdAt: number
}

interface GameState {
  playerId: string
  playerName: string
  isHost: boolean
  room: GameRoom | null
  roomCode: string
  currentScreen: string
  unsubscribeRoom: (() => void) | null

  setScreen: (screen: string) => void
  setPlayerName: (name: string) => void
  createRoom: (gameName: string, mode: 'timer' | 'qlimit', limit: number, playerCount?: number) => Promise<string>
  joinRoom: (code: string, name: string) => Promise<boolean>
  startGame: () => Promise<void>
  submitTarget: (target: GameRoom['target']) => Promise<void>
  startRoundTimer: () => Promise<void>
  askQuestion: (text: string) => Promise<void>
  answerQuestion: (questionId: string, answer: string) => Promise<void>
  submitGuess: (text: string) => Promise<void>
  confirmGuess: (guessId: string, isCorrect: boolean) => Promise<void>
  nextRound: () => Promise<void>
  endRoundNoWinner: () => Promise<void>
  extendRound: () => Promise<void>
  endGame: () => Promise<void>
  leaveRoom: () => Promise<void>
  reset: () => void
}

function avatarFor(name: string): string {
  return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || 'Player')}&backgroundType=gradientLinear`
}

function sanitizeFirebaseValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map(sanitizeFirebaseValue)
      .filter((item) => item !== undefined) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key.replace(/[.#$/[\]]/g, '_'), sanitizeFirebaseValue(item)])
    ) as T
  }

  return value
}

function syncScreenFromRoom(data: GameRoom, playerId: string, currentScreen: string): string | null {
  const syncable = ['lobby', 'role-selector', 'role-guesser', 'selector', 'guesser', 'reveal', 'final']
  if (!syncable.includes(currentScreen)) return null

  if (data.status === 'waiting') return 'lobby'
  if (data.status === 'playing') {
    const isSelector = data.selectorId === playerId
    if (!data.target) {
      return isSelector ? 'role-selector' : 'role-guesser'
    }
    return isSelector ? 'selector' : 'guesser'
  }
  if (data.status === 'revealing') return 'reveal'
  if (data.status === 'ended') return 'final'
  return null
}

export const useGameStore = create<GameState>((set, get) => ({
  playerId: '',
  playerName: '',
  isHost: false,
  room: null,
  roomCode: '',
  currentScreen: 'home',
  unsubscribeRoom: null,

  setScreen: (screen) => set({ currentScreen: screen }),

  setPlayerName: (name) => set({ playerName: name }),

  createRoom: async (gameName, mode, limit, playerCount = 15) => {
    if (!db) throw new Error('Firebase not initialized')

    let code = generateRoomCode()
    for (let i = 0; i < 5; i++) {
      const snap = await firebaseGet(ref(db, `rooms/${code}`))
      if (!snap.exists()) break
      code = generateRoomCode()
      if (i === 4) throw new Error('Unable to generate unique room code. Try again.')
    }

    const playerId = 'host-' + Date.now()

    const room: GameRoom = {
      code,
      name: gameName,
      hostId: playerId,
      status: 'waiting',
      gameMode: mode,
      timerSeconds: mode === 'timer' ? limit : 240,
      qLimit: mode === 'qlimit' ? limit : 30,
      maxPlayers: playerCount,
      totalRounds: 0,
      currentRound: 1,
      selectorIndex: 0,
      players: {
        [playerId]: {
          id: playerId,
          name: get().playerName || 'Host',
          avatarUrl: avatarFor(get().playerName || 'Host'),
          isHost: true,
          isOnline: true,
          score: 0,
          correct: 0,
          wrong: 0,
          selectorWins: 0,
        }
      },
      target: null,
      questions: {},
      guesses: {},
      createdAt: Date.now(),
    }

    await firebaseSet(ref(db, `rooms/${code}`), room)

    const roomRef = ref(db, `rooms/${code}`)
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const state = get()
      const data = snapshot.val() as GameRoom | null
      if (data) {
        const nextScreen = syncScreenFromRoom(data, state.playerId, state.currentScreen)
        if (nextScreen && nextScreen !== state.currentScreen) {
          set({ room: data, currentScreen: nextScreen })
        } else {
          set({ room: data })
        }
      } else {
        state.leaveRoom()
      }
    })

    set({
      playerId,
      isHost: true,
      roomCode: code,
      room,
      unsubscribeRoom: unsubscribe,
    })

    return code
  },

  joinRoom: async (code, name) => {
    if (!db) return false

    try {
      const roomRef = ref(db, `rooms/${code}`)
      const snapshot = await firebaseGet(roomRef)
      const room = snapshot.val() as GameRoom | null

      if (!room) return false
      if (room.status !== 'waiting') return false
      if (Object.keys(room.players).length >= (room.maxPlayers || 15)) return false

      const playerId = 'player-' + Date.now()
      const newPlayer: Player = {
        id: playerId,
        name,
        avatarUrl: avatarFor(name),
        isHost: false,
        isOnline: true,
        score: 0,
        correct: 0,
        wrong: 0,
        selectorWins: 0,
      }

      await update(ref(db, `rooms/${code}/players`), {
        [playerId]: newPlayer
      })

      const unsubscribe = onValue(roomRef, (snapshot) => {
        const state = get()
        const data = snapshot.val() as GameRoom | null
        if (data) {
          const nextScreen = syncScreenFromRoom(data, state.playerId, state.currentScreen)
          if (nextScreen && nextScreen !== state.currentScreen) {
            set({ room: data, currentScreen: nextScreen })
          } else {
            set({ room: data })
          }
        } else {
          state.leaveRoom()
        }
      })

      set({
        playerId,
        playerName: name,
        isHost: false,
        roomCode: code,
        room,
        unsubscribeRoom: unsubscribe,
        currentScreen: 'lobby'
      })

      return true
    } catch (err) {
      console.error('joinRoom error:', err)
      return false
    }
  },

  startGame: async () => {
    const { roomCode, playerId, room } = get()
    if (!db || !roomCode || !room) return

    const playerIds = Object.keys(room.players)
    const selectorIndex = room.selectorIndex || 0
    const selectorId = playerIds[selectorIndex]

    await update(ref(db, `rooms/${roomCode}`), {
      status: 'playing',
      currentRound: 1,
      selectorIndex: 0,
      selectorId,
      totalRounds: playerIds.length,
      roundStartedAt: null,
      playerOrder: playerIds,
    })

    const screen = playerId === selectorId ? 'role-selector' : 'role-guesser'
    set({ currentScreen: screen })
  },

  submitTarget: async (target) => {
    const { roomCode, playerId, room } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId) return

    const selector = room?.players[playerId]
    const targetWithAvatar = target && target.category === 'Yourself' && selector?.avatarUrl
      ? { ...target, imageUrl: selector.avatarUrl }
      : target
    const cleanTarget = targetWithAvatar ? sanitizeFirebaseValue(targetWithAvatar) : targetWithAvatar

    await update(ref(db, `rooms/${roomCode}`), {
      target: cleanTarget,
      // Timer starts only when the selector clicks "Start Answering"
      // on the TargetConfirmScreen via startRoundTimer().
    })
  },

  startRoundTimer: async () => {
    const { roomCode, room, playerId } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId) return
    if (room.roundStartedAt) return

    await update(ref(db, `rooms/${roomCode}`), {
      roundStartedAt: Date.now(),
    })
  },

  askQuestion: async (text) => {
    const { roomCode, playerId, playerName } = get()
    if (!db || !roomCode) return

    const questionsRef = ref(db, `rooms/${roomCode}/questions`)
    const newRef = push(questionsRef)
    const questionId = newRef.key!
    const question: Question = {
      id: questionId,
      askerId: playerId,
      askerName: playerName,
      text,
      answer: '...',
    }

    await firebaseSet(newRef, question)
  },

  answerQuestion: async (questionId, answer) => {
    const { roomCode, playerId, room } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId) return

    await update(ref(db, `rooms/${roomCode}/questions/${questionId}`), { answer })
  },

  submitGuess: async (text) => {
    const { roomCode, playerId, playerName, room } = get()
    if (!db || !roomCode || !room) return

    const target = room.target
    if (!target) return

    const isPersonal = ['Yourself', 'Family Member', 'Friend / Acquaintance'].includes(target.category || '')

    let matchResult: 'exact' | 'partial' | 'none' = 'none'

    if (!isPersonal) {
      const aliases = target.aliases?.length
        ? target.aliases
        : generateAliases(target.canonicalName || target.name, '', target.referenceExtract || '')
      matchResult = matchAlias(text, aliases)
    } else {
      // Personal targets are always judged manually by the selector.
      // We still compute a match hint for the selector UI, but the guess stays pending.
      const aliases = [
        ...(target.aliases || []),
        target.name,
        ...(room.selectorId && room.players[room.selectorId]?.name ? [room.players[room.selectorId].name] : []),
      ]
      matchResult = matchAlias(text, aliases)
    }

    // Public targets: exact match is auto-correct, partial goes to pending for selector review.
    // Personal targets: always pending; selector decides.
    const correct = !isPersonal && matchResult === 'exact'
    const status: Guess['status'] = isPersonal
      ? 'pending'
      : matchResult === 'exact'
        ? 'correct'
        : matchResult === 'partial'
          ? 'pending'
          : 'wrong'

    const guessId = push(ref(db, `rooms/${roomCode}/guesses`)).key!
    const roomRef = ref(db, `rooms/${roomCode}`)

    await runTransaction(roomRef, (currentRoom) => {
      if (!currentRoom) return currentRoom

      if (!currentRoom.guesses) currentRoom.guesses = {}
      if (!currentRoom.players) currentRoom.players = {}

      const guesses = currentRoom.guesses as Record<string, Guess>
      const existingCorrect = Object.values(guesses).some((g: Guess) => g.correct)
      const isFirst = correct && !existingCorrect

      guesses[guessId] = {
        id: guessId,
        playerId,
        playerName,
        text,
        correct,
        status,
        isFirst,
        matchType: matchResult,
      }

      if (correct) {
        const player = currentRoom.players[playerId]
        if (player) {
          player.score = (player.score || 0) + (isFirst ? 2 : 1)
          player.correct = (player.correct || 0) + 1
        }
        currentRoom.status = 'revealing'
      } else if (!correct && !isPersonal) {
        const player = currentRoom.players[playerId]
        if (player) {
          player.wrong = (player.wrong || 0) + 1
        }
      }

      return currentRoom
    })

    if (correct) {
      set({ currentScreen: 'reveal' })
    }
  },

  confirmGuess: async (guessId, isCorrect) => {
    const { roomCode, room, playerId } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId) return

    const guess = room.guesses[guessId]
    if (!guess) return

    const roomRef = ref(db, `rooms/${roomCode}`)

    await runTransaction(roomRef, (currentRoom) => {
      if (!currentRoom) return currentRoom
      if (!currentRoom.guesses) currentRoom.guesses = {}
      if (!currentRoom.players) currentRoom.players = {}

      const guesses = currentRoom.guesses as Record<string, Guess>
      const currentGuess = guesses[guessId]
      if (!currentGuess) return currentRoom
      if (currentGuess.status !== 'pending') return currentRoom

      const existingCorrect = Object.values(guesses).filter((g: Guess) => g.correct).length
      const isFirst = isCorrect && existingCorrect === 0

      currentGuess.correct = isCorrect
      currentGuess.status = isCorrect ? 'correct' : 'wrong'
      currentGuess.isFirst = isFirst

      if (isCorrect) {
        const guesser = currentRoom.players[currentGuess.playerId]
        if (guesser) {
          const points = isFirst ? 2 : 1
          guesser.score = (guesser.score || 0) + points
          guesser.correct = (guesser.correct || 0) + 1
        }
        currentRoom.status = 'revealing'
      } else {
        const guesser = currentRoom.players[currentGuess.playerId]
        if (guesser) {
          guesser.wrong = (guesser.wrong || 0) + 1
        }
      }

      return currentRoom
    })

    if (isCorrect) {
      set({ currentScreen: 'reveal' })
    }
  },

  endRoundNoWinner: async () => {
    const { roomCode, room, playerId } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId) return

    const roomRef = ref(db, `rooms/${roomCode}`)

    await runTransaction(roomRef, (currentRoom) => {
      if (!currentRoom) return currentRoom
      if (!currentRoom.guesses) currentRoom.guesses = {}
      if (!currentRoom.players) currentRoom.players = {}

      const guesses = currentRoom.guesses as Record<string, Guess>
      const players = currentRoom.players as Record<string, Player>

      let autoConfirmed = false

      for (const [gid, g] of Object.entries(guesses)) {
        const guess = g as Guess
        if (guess.status === 'pending' && guess.matchType === 'exact') {
          const existingCorrect = Object.values(guesses).filter((x: Guess) => x.correct).length
          const isFirst = existingCorrect === 0

          guess.correct = true
          guess.status = 'correct'
          guess.isFirst = isFirst

          const guesser = players[guess.playerId]
          if (guesser) {
            const points = isFirst ? 2 : 1
            guesser.score = (guesser.score || 0) + points
            guesser.correct = (guesser.correct || 0) + 1
          }

          currentRoom.status = 'revealing'
          autoConfirmed = true
          break
        }
      }

      if (!autoConfirmed) {
        const selectorId = currentRoom.selectorId
        if (selectorId && players[selectorId]) {
          const selector = players[selectorId]
          selector.score = (selector.score || 0) + 1
          selector.selectorWins = (selector.selectorWins || 0) + 1
        }
        currentRoom.status = 'revealing'
      }

      return currentRoom
    })

    set({ currentScreen: 'reveal' })
  },

  extendRound: async () => {
    const { roomCode, room, playerId } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId) return

    if (room.gameMode === 'timer') {
      await update(ref(db, `rooms/${roomCode}`), {
        timerSeconds: room.timerSeconds + 60,
      })
    } else {
      await update(ref(db, `rooms/${roomCode}`), {
        qLimit: room.qLimit + 5,
      })
    }
  },

  endGame: async () => {
    const { roomCode, isHost } = get()
    if (!db || !roomCode) return
    if (!isHost) return

    await update(ref(db, `rooms/${roomCode}`), { status: 'ended' })
    set({ currentScreen: 'final' })
  },

  nextRound: async () => {
    const { roomCode, room, playerId, isHost } = get()
    if (!db || !roomCode || !room) return
    if (room.selectorId !== playerId && !isHost) return

    const nextRoundNum = room.currentRound + 1
    const playerOrder = room.playerOrder || Object.keys(room.players)
    const nextSelectorIndex = (room.selectorIndex + 1) % playerOrder.length
    const nextSelectorId = playerOrder[nextSelectorIndex]

    if (nextRoundNum > room.totalRounds) {
      await update(ref(db, `rooms/${roomCode}`), { status: 'ended' })
      set({ currentScreen: 'final' })
      return
    }

    await update(ref(db, `rooms/${roomCode}`), {
      currentRound: nextRoundNum,
      selectorIndex: nextSelectorIndex,
      selectorId: nextSelectorId,
      roundStartedAt: null,
      target: null,
      status: 'playing',
      questions: null,
      guesses: null,
    })

    const screen = playerId === nextSelectorId ? 'role-selector' : 'role-guesser'
    set({ currentScreen: screen })
  },

  leaveRoom: async () => {
    const { roomCode, playerId, unsubscribeRoom, isHost } = get()

    if (unsubscribeRoom) {
      unsubscribeRoom()
    }

    if (db && roomCode && playerId) {
      try {
        await remove(ref(db, `rooms/${roomCode}/players/${playerId}`))
        if (isHost) {
          await remove(ref(db, `rooms/${roomCode}`))
        }
      } catch (err) {
        console.error('leaveRoom cleanup error:', err)
      }
    }

    set({
      room: null,
      roomCode: '',
      playerId: '',
      isHost: false,
      unsubscribeRoom: null,
      currentScreen: 'home'
    })
  },

  reset: () => {
    const { unsubscribeRoom, roomCode, playerId, isHost } = get()
    if (unsubscribeRoom) {
      unsubscribeRoom()
    }
    if (db && roomCode && playerId) {
      remove(ref(db, `rooms/${roomCode}/players/${playerId}`)).catch(() => {})
      if (isHost) {
        remove(ref(db, `rooms/${roomCode}`)).catch(() => {})
      }
    }
    set({
      playerId: '',
      playerName: '',
      isHost: false,
      room: null,
      roomCode: '',
      unsubscribeRoom: null,
      currentScreen: 'home',
    })
  },
}))