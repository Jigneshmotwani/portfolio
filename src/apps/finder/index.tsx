import { useApp } from '../types'
import { IOSFiles } from './IOSFiles'
import { MacFinder } from './MacFinder'
import './Finder.css'

/** Finder on macOS, Files on iOS. Both browse the shared virtual file system (src/data/vfs.ts). */
export default function Finder() {
  const { platform } = useApp()
  return platform === 'ios' ? <IOSFiles /> : <MacFinder />
}
