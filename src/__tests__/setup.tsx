import '@testing-library/jest-dom';
import React from 'react';

// ============================================
// MOCKS GLOBALES PARA PRUEBAS UNITARIAS
// ============================================

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    const store: Record<string, string> = {
      'ajayu_token': 'mock-token-12345',
      'user': JSON.stringify({ id: 1, name: 'Test User', role: 'instructor' })
    };
    return store[key] || null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock fetch
global.fetch = jest.fn();

// ============================================
// MOCKS DE BASE DE DATOS
// ============================================
const mockDatabase = {
  executeQuery: jest.fn(),
  query: jest.fn(),
  getConnection: jest.fn(),
};

jest.mock('@/lib/database', () => ({
  executeQuery: (...args: any[]) => mockDatabase.executeQuery(...args),
  default: {
    executeQuery: (...args: any[]) => mockDatabase.executeQuery(...args),
  },
  __esModule: true,
}));

// Para reutilizar en tests
export { mockDatabase };

// ============================================
// MOCKS DE AUTENTICACIÓN
// ============================================
const mockAuth = {
  getUserFromToken: jest.fn(),
  verifyToken: jest.fn(),
};

jest.mock('@/lib/auth', () => ({
  getUserFromToken: (...args: any[]) => mockAuth.getUserFromToken(...args),
  verifyToken: (...args: any[]) => mockAuth.verifyToken(...args),
  __esModule: true,
}));

export { mockAuth };

// ============================================
// MOCKS DE LUCIDE-ICONS USANDO React.createElement
// ============================================

// Función helper para crear iconos mock
const createMockIcon = (testId: string, content: string) => {
  return function MockIcon({ className }: { className?: string }) {
    return React.createElement('span', { 'data-testid': testId, className }, content);
  };
};

const createMockIconWithFill = (testId: string, content: string) => {
  return function MockIcon({ fill, className }: { fill?: string; className?: string }) {
    return React.createElement('span', { 'data-testid': testId, 'data-filled': fill, className }, content);
  };
};

// Crear los componentes mock
const MockStar = createMockIconWithFill('star-icon', '★');
const MockStarHalf = createMockIcon('star-half-icon', '★');
const MockThumbsUp = createMockIcon('thumbs-up-icon', '👍');
const MockThumbsDown = createMockIcon('thumbs-down-icon', '👎');
const MockMessageCircle = createMockIcon('message-icon', '💬');
const MockEye = createMockIcon('eye-icon', '👁️');
const MockEdit = createMockIcon('edit-icon', '✏️');
const MockTrash = createMockIcon('trash-icon', '🗑️');
const MockPlus = createMockIcon('plus-icon', '➕');
const MockCheck = createMockIcon('check-icon', '✓');
const MockX = createMockIcon('x-icon', '✕');
const MockBookOpen = createMockIcon('book-open-icon', '📖');
const MockVideo = createMockIcon('video-icon', '🎬');
const MockFileText = createMockIcon('file-text-icon', '📄');
const MockUsers = createMockIcon('users-icon', '👥');
const MockGraduationCap = createMockIcon('graduation-cap-icon', '🎓');
const MockChevronDown = createMockIcon('chevron-down-icon', '▼');
const MockChevronUp = createMockIcon('chevron-up-icon', '▲');
const MockChevronLeft = createMockIcon('chevron-left-icon', '◀');
const MockChevronRight = createMockIcon('chevron-right-icon', '▶');
const MockSearch = createMockIcon('search-icon', '🔍');
const MockFilter = createMockIcon('filter-icon', '🔽');
const MockDownload = createMockIcon('download-icon', '⬇️');
const MockUpload = createMockIcon('upload-icon', '⬆️');
const MockClock = createMockIcon('clock-icon', '⏰');
const MockCalendar = createMockIcon('calendar-icon', '📅');
const MockAward = createMockIcon('award-icon', '🏆');
const MockAlertCircle = createMockIcon('alert-icon', '⚠️');
const MockCheckCircle = createMockIcon('check-circle-icon', '✅');
const MockInfo = createMockIcon('info-icon', 'ℹ️');
const MockMenu = createMockIcon('menu-icon', '☰');
const MockSettings = createMockIcon('settings-icon', '⚙️');
const MockLogOut = createMockIcon('logout-icon', '🚪');
const MockUser = createMockIcon('user-icon', '👤');
const MockHome = createMockIcon('home-icon', '🏠');
const MockBook = createMockIcon('book-icon', '📚');
const MockFolder = createMockIcon('folder-icon', '📁');
const MockLink = createMockIcon('link-icon', '🔗');
const MockImage = createMockIcon('image-icon', '🖼️');
const MockPlay = createMockIcon('play-icon', '▶️');
const MockPause = createMockIcon('pause-icon', '⏸️');
const MockSave = createMockIcon('save-icon', '💾');
const MockSend = createMockIcon('send-icon', '📤');
const MockPaperclip = createMockIcon('paperclip-icon', '📎');
const MockMoreVertical = createMockIcon('more-vertical-icon', '⋮');
const MockExternalLink = createMockIcon('external-link-icon', '🔗');
const MockCrown = createMockIcon('crown-icon', '👑');
const MockShield = createMockIcon('shield-icon', '🛡️');
const MockLock = createMockIcon('lock-icon', '🔒');
const MockUnlock = createMockIcon('unlock-icon', '🔓');
const MockBell = createMockIcon('bell-icon', '🔔');
const MockMail = createMockIcon('mail-icon', '✉️');
const MockPhone = createMockIcon('phone-icon', '📞');
const MockMapPin = createMockIcon('map-pin-icon', '📍');
const MockDollarSign = createMockIcon('dollar-icon', '$');
const MockPercent = createMockIcon('percent-icon', '%');
const MockArrowRight = createMockIcon('arrow-right-icon', '→');
const MockArrowLeft = createMockIcon('arrow-left-icon', '←');
const MockArrowUp = createMockIcon('arrow-up-icon', '↑');
const MockArrowDown = createMockIcon('arrow-down-icon', '↓');
const MockRefreshCw = createMockIcon('refresh-icon', '🔄');
const MockLoader = createMockIcon('loader-icon', '⏳');
const MockAlertTriangle = createMockIcon('alert-triangle-icon', '⚠️');
const MockGlobe = createMockIcon('globe-icon', '🌐');
const MockHeart = createMockIcon('heart-icon', '❤️');
const MockShare = createMockIcon('share-icon', '🔗');
const MockCopy = createMockIcon('copy-icon', '📋');
const MockEyeOff = createMockIcon('eye-off-icon', '🙈');
const MockMaximize = createMockIcon('maximize-icon', '⛶');
const MockMinimize = createMockIcon('minimize-icon', '➖');
const MockLayout = createMockIcon('layout-icon', '📐');
const MockLayers = createMockIcon('layers-icon', '📚');
const MockList = createMockIcon('list-icon', '☰');
const MockGrid = createMockIcon('grid-icon', '▦');
const MockPieChart = createMockIcon('pie-chart-icon', '📊');
const MockBarChart = createMockIcon('bar-chart-icon', '📈');
const MockTrendingUp = createMockIcon('trending-up-icon', '📈');
const MockTrendingDown = createMockIcon('trending-down-icon', '📉');

jest.mock('lucide-react', () => ({
  Star: MockStar,
  StarHalf: MockStarHalf,
  ThumbsUp: MockThumbsUp,
  ThumbsDown: MockThumbsDown,
  MessageCircle: MockMessageCircle,
  Eye: MockEye,
  Edit: MockEdit,
  Trash: MockTrash,
  Plus: MockPlus,
  Check: MockCheck,
  X: MockX,
  BookOpen: MockBookOpen,
  Video: MockVideo,
  FileText: MockFileText,
  Users: MockUsers,
  GraduationCap: MockGraduationCap,
  ChevronDown: MockChevronDown,
  ChevronUp: MockChevronUp,
  ChevronLeft: MockChevronLeft,
  ChevronRight: MockChevronRight,
  Search: MockSearch,
  Filter: MockFilter,
  Download: MockDownload,
  Upload: MockUpload,
  Clock: MockClock,
  Calendar: MockCalendar,
  Award: MockAward,
  AlertCircle: MockAlertCircle,
  CheckCircle: MockCheckCircle,
  Info: MockInfo,
  Menu: MockMenu,
  Settings: MockSettings,
  LogOut: MockLogOut,
  User: MockUser,
  Home: MockHome,
  Book: MockBook,
  Folder: MockFolder,
  Link: MockLink,
  Image: MockImage,
  Play: MockPlay,
  Pause: MockPause,
  Save: MockSave,
  Send: MockSend,
  Paperclip: MockPaperclip,
  MoreVertical: MockMoreVertical,
  ExternalLink: MockExternalLink,
  Crown: MockCrown,
  Shield: MockShield,
  Lock: MockLock,
  Unlock: MockUnlock,
  Bell: MockBell,
  Mail: MockMail,
  Phone: MockPhone,
  MapPin: MockMapPin,
  DollarSign: MockDollarSign,
  Percent: MockPercent,
  ArrowRight: MockArrowRight,
  ArrowLeft: MockArrowLeft,
  ArrowUp: MockArrowUp,
  ArrowDown: MockArrowDown,
  RefreshCw: MockRefreshCw,
  Loader: MockLoader,
  AlertTriangle: MockAlertTriangle,
  Globe: MockGlobe,
  Heart: MockHeart,
  Share: MockShare,
  Copy: MockCopy,
  EyeOff: MockEyeOff,
  Maximize: MockMaximize,
  Minimize: MockMinimize,
  Layout: MockLayout,
  Layers: MockLayers,
  List: MockList,
  Grid: MockGrid,
  PieChart: MockPieChart,
  BarChart: MockBarChart,
  TrendingUp: MockTrendingUp,
  TrendingDown: MockTrendingDown,
}));

// ============================================
// CONFIGURACIÓN DE JEST
// ============================================

// Silence React warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Helper para limpiar mocks entre tests
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue('mock-token-12345');
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
});
