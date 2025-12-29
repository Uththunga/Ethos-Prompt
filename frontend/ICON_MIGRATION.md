# Icon Import Migration Guide

## Before (Direct imports - larger bundle):
```typescript
import { UserIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Menu, Settings } from 'lucide-react';
```

## After (Optimized imports - smaller bundle):
```typescript
import { UserIcon, HomeIcon, Menu, Settings } from '../components/icons';
```

## Benefits:
- Better tree shaking
- Smaller bundle size
- Centralized icon management
- Easier to track icon usage

## Used Icons:
### Heroicons (82):
- AcademicCapIcon
- ArrowDownTrayIcon
- ArrowTrendingDownIcon
- ArrowTrendingUpIcon
- BeakerIcon
- BellIcon
- BoltIcon
- BookOpenIcon
- BrainIcon
- BriefcaseIcon
- BugAntIcon
- BuildingOfficeIcon
- CalendarIcon
- ChartBarIcon
- ChatBubbleLeftIcon
- ChatBubbleLeftRightIcon
- CheckCircleIcon
- CheckIcon
- ChevronDownIcon
- ChevronLeftIcon
- ChevronRightIcon
- ChevronUpIcon
- ClipboardIcon
- ClockIcon
- Cog6ToothIcon
- CogIcon
- ComputerDesktopIcon
- CpuChipIcon
- CreditCardIcon
- CubeIcon
- CurrencyDollarIcon
- DevicePhoneMobileIcon
- DocumentArrowDownIcon
- DocumentDuplicateIcon
- DocumentTextIcon
- EllipsisVerticalIcon
- EnvelopeIcon
- ExclamationTriangleIcon
- EyeIcon
- EyeSlashIcon
- FireIcon
- FunnelIcon
- GlobeAltIcon
- HeartIcon
- HeartIcon as HeartIconSolid
- InformationCircleIcon
- KeyIcon
- LightBulbIcon
- LinkIcon
- LockClosedIcon
- MagnifyingGlassIcon
- MegaphoneIcon
- PaperAirplaneIcon
- PauseIcon
- PencilIcon
- PlayCircleIcon
- PlayIcon
- PlusIcon
- QuestionMarkCircleIcon
- ReplyIcon
- RocketLaunchIcon
- ScaleIcon
- ServerIcon
- ShareIcon
- ShieldCheckIcon
- ShieldExclamationIcon
- SignalIcon
- SparklesIcon
- StarIcon
- StarIcon as StarIconSolid
- StopIcon
- TagIcon
- TrashIcon
- TrendingDownIcon
- TrendingUpIcon
- TrophyIcon
- UserGroupIcon
- UserIcon
- UserPlusIcon
- VideoCameraIcon
- XCircleIcon
- XMarkIcon

### Lucide (54):
- AlertCircle
- AlertTriangle
- ArrowLeft
- ArrowRight
- BarChart
- BarChart3
- BookOpen
- Brain
- Briefcase
- Calendar
- CheckCircle
- Clock
- Code
- Database
- DollarSign
- Download
- Edit
- Eye
- EyeOff
- File
- FileText
- GraduationCap
- Hash
- HelpCircle
- Home
- Info
- Lightbulb
- List
- Lock
- LogOut
- Mail
- Menu
- MessageSquare
- Play
- Plus
- RefreshCw
- Save
- Search
- Settings
- Sparkles
- Star
- Tag
- Target
- ToggleLeft
- Trash2
- TrendingUp
- Type
- Upload
- User
- Users
- Wand2
- X
- XCircle
- Zap
