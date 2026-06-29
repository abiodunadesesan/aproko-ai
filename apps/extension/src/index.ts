export type ExtensionBootstrapConfig = {
  environment: 'development' | 'staging' | 'production';
};

export function bootstrapExtension(config: ExtensionBootstrapConfig): void {
  void config;
}
