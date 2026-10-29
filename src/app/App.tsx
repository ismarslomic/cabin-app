import { App as F7App, View } from 'framework7-react'
import '@/app/f7-setup.ts'
import { f7params } from '@/app/f7-params.ts'

export default function App() {
  return (
    <F7App {...f7params}>
      <View main url="/" />
    </F7App>
  )
}
