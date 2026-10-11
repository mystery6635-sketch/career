// 디자인 시스템 진입점. /design-sync가 이 파일을 라이브러리로 빌드해(`npm run build:lib`) Claude Design에 올린다.
// 글꼴(@fontsource)은 여기서 불러오지 않는다. 라이브러리 모드가 글꼴을 CSS에 통째로 끼워 넣기 때문에
// /design-sync 설정의 extraFonts로 따로 싣는다. 앱(main.tsx)은 이 파일을 쓰지 않는다. 앱과 같은 컴포넌트·같은 CSS를 그대로 내보낸다.
import './styles/global.css'

export { Alert } from './components/ui/Alert'
export { Badge, NeedsConfirmBadge, StandardNameBadge } from './components/ui/Badge'
export { Button, ButtonLink } from './components/ui/Button'
export { Card } from './components/ui/Card'
export { Checkbox } from './components/ui/Checkbox'
export { Field } from './components/ui/Field'
export { Header } from './components/ui/Header'
export { Input } from './components/ui/Input'
export { PageHeader } from './components/ui/PageHeader'
export { Radio } from './components/ui/Radio'
export { Select } from './components/ui/Select'
export { SkipLink } from './components/ui/SkipLink'
export { Tag } from './components/ui/Tag'
export { Textarea } from './components/ui/Textarea'
