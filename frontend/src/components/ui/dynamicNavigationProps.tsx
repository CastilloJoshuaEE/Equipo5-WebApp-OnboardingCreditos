// frontend/src/components/ui/dynamicNavigationProps.tsx
export interface DynamicNavigationProps {
  onNavigate?: () => void;
  navigationHandler?: (path: string) => void;
}
