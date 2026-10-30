import { Block, BlockTitle } from 'framework7-react'

// Titled empty card that marks where a section's content goes. Replace it when the content exists.
export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <BlockTitle>{title}</BlockTitle>
      <Block strong inset>
        <p className="placeholder-text">Innhold kommer snart.</p>
      </Block>
    </>
  )
}
