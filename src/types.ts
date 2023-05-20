export type GptioInput = {
  name: string;
  type: string;
  description: string;
};

export type GptioAction = {
  name: string;
  description: string;
  func: Function;
  inputs: GptioInput[];
};

export type GptioResponse = {
  type: string;
  action?: string;
  input?: object;
  thought?: string;
  data?: string;
  done?: boolean;
};

export type GptioCallbacks = {
  beforeAction?: (action: GptioAction, input: string) => any;
  afterAction?: (action: GptioAction, input: string, result: any) => any;
  afterThought?: (thought: string) => any;
};

export type GptioOptions = {
  evaluation?: boolean;
  debug?: boolean;
  timeout?: number;
};