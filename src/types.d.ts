declare type ResourceType = 'external-script' | 'inline-script' | 'external-style' | 'inline-style';
declare type ResourceTagType = 'SCRIPT' | 'STYLE' | 'LINK';

declare interface Resource {
  content: string;
  type: ResourceType;
  block?: boolean;
}

declare interface ScriptResource extends Resource {
  type: 'external-script' | 'inline-script';
}

declare interface StyleResource extends Resource {
  type: 'external-style' | 'inline-style';
}
