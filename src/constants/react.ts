// React component type definitions to replace React.FC
export type ComponentWithChildren<P = {}> = (props: P & { children?: React.ReactNode }) => React.ReactElement | null;

export type Component<P = {}> = (props: P) => React.ReactElement | null;

// Common prop patterns
export interface BaseComponentProps {
  className?: string;
}

export interface ComponentWithChildrenProps extends BaseComponentProps {
  children?: React.ReactNode;
}