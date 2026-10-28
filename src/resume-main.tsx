import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ResumePage } from './components/resume/ResumePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ResumePage />
  </StrictMode>,
)
