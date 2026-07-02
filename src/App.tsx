import React from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useGameStore } from './store/gameStore'
import { HomeScreen } from './screens/HomeScreen'
import { CreateScreen } from './screens/CreateScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { RoleSelectorScreen } from './screens/RoleSelectorScreen'
import { RoleGuesserScreen } from './screens/RoleGuesserScreen'
import { TargetEntryScreen } from './screens/TargetEntryScreen'
import { TargetConfirmScreen } from './screens/TargetConfirmScreen'
import { SelectorScreen } from './screens/SelectorScreen'
import { GuesserScreen } from './screens/GuesserScreen'
import { GuessInputScreen } from './screens/GuessInputScreen'
import { RevealScreen } from './screens/RevealScreen'
import { FinalScreen } from './screens/FinalScreen'

const SCREENS: Record<string, React.FC> = {
  home: HomeScreen,
  create: CreateScreen,
  lobby: LobbyScreen,
  'role-selector': RoleSelectorScreen,
  'role-guesser': RoleGuesserScreen,
  'target-entry': TargetEntryScreen,
  'target-confirm': TargetConfirmScreen,
  selector: SelectorScreen,
  guesser: GuesserScreen,
  'guess-input': GuessInputScreen,
  reveal: RevealScreen,
  final: FinalScreen,
}

function App() {
  const currentScreen = useGameStore((state) => state.currentScreen)
  const Screen = SCREENS[currentScreen] || HomeScreen

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-on-background font-jakarta">
        <Screen />
      </div>
    </ErrorBoundary>
  )
}

export default App
