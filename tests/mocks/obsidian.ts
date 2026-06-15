export class FileView {
  app: any;
  containerEl: any;
  constructor(public readonly leaf?: any) {
    this.app = leaf?.app;
    this.containerEl = {
      empty: () => undefined,
      addClass: () => undefined,
      createDiv: () => ({
        empty: () => undefined,
        createDiv: () => ({}),
        createEl: () => ({}),
        addEventListener: () => undefined,
        removeEventListener: () => undefined
      })
    };
  }
}

export class ItemView extends FileView {}

export class Notice {
  constructor(public readonly message: string) {}
}

export class Plugin {
  app: any;
  addCommand(): void {}
  addSettingTab(): void {}
  registerExtensions(): void {}
  registerView(): void {}
  registerDomEvent(): void {}
  registerEvent(): void {}
  loadData(): Promise<unknown> {
    return Promise.resolve(null);
  }
  saveData(): Promise<void> {
    return Promise.resolve();
  }
}

export class PluginSettingTab {
  containerEl = { empty: () => undefined };
  constructor(public readonly app?: unknown, public readonly plugin?: unknown) {}
}

class MockSettingControl {
  setValue(): this {
    return this;
  }
  onChange(): this {
    return this;
  }
}

export class Setting {
  constructor(public readonly containerEl?: unknown) {}
  setName(): this {
    return this;
  }
  setDesc(): this {
    return this;
  }
  addToggle(callback: (toggle: MockSettingControl) => unknown): this {
    callback(new MockSettingControl());
    return this;
  }
  addText(callback: (text: MockSettingControl) => unknown): this {
    callback(new MockSettingControl());
    return this;
  }
}

export class TFile {
  basename: string;
  stat = { mtime: 0 };
  constructor(public readonly path = "", public readonly extension = "") {
    this.basename = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? path;
  }
}

export interface WorkspaceLeaf {
  view: unknown;
  setViewState(state: unknown): Promise<void>;
}

export interface Vault {
  adapter: DataAdapter;
  getAbstractFileByPath(path: string): unknown;
  read(file: TFile): Promise<string>;
  readBinary(file: TFile): Promise<ArrayBuffer>;
  modify(file: TFile, data: string): Promise<void>;
  modifyBinary(file: TFile, data: ArrayBuffer): Promise<void>;
  create(path: string, data: string): Promise<TFile>;
}

export interface DataAdapter {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
}

export interface App {}
