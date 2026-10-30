import { useState } from 'react'
import { App as F7App, Link, Toolbar, ToolbarPane, View, Views } from 'framework7-react'
import '@/app/f7-setup.ts'
import { f7params } from '@/app/f7-params.ts'
import { tabForPath, tabs } from '@/app/tabs.ts'
import type { TabDefinition } from '@/app/tabs.ts'
import UpdatePrompt from '@/app/UpdatePrompt.tsx'

export default function App() {
  // React owns the active tab: Framework7 toggles the class itself, but React re-renders would overwrite it.
  const [activeId, setActiveId] = useState(() => tabForPath(window.location.pathname).id)

  const [activeInitialId] = useState(activeId)

  // Reflect the tab in the URL bar (replace, not push: tab switches should not fill the history).
  const showTab = ({ id, url }: TabDefinition) => {
    setActiveId(id)
    if (window.location.pathname !== url) window.history.replaceState(null, '', url)
  }

  return (
    <F7App {...f7params}>
      <Views tabs className="safe-areas">
        <Toolbar tabbar icons bottom>
          <ToolbarPane>
            {tabs.map(({ id, label, icon: Icon }) => (
              <Link key={id} tabLink={`#${id}`} tabLinkActive={id === activeId}>
                <Icon size={24} />
                <span className="tabbar-label">{label}</span>
              </Link>
            ))}
          </ToolbarPane>
        </Toolbar>
        {tabs.map((tab, index) => (
          <View
            key={tab.id}
            id={tab.id}
            main={index === 0}
            tab
            tabActive={tab.id === activeInitialId}
            url={tab.url}
            onTabShow={() => {
              showTab(tab)
            }}
          />
        ))}
      </Views>
      <UpdatePrompt />
    </F7App>
  )
}
