declare type ResourceType = 'script' | 'style';
declare type ResourceTagType = 'SCRIPT' | 'LINK';

declare interface Resource {
  url: string;
  type: ResourceType;
}
