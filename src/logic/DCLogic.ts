export type StateUpdate<S> = Partial<S> | ((state: S) => Partial<S> | null | undefined);

export class DCLogic<P = Record<string, unknown>, S extends Record<string, any> = Record<string, any>> {
  props: P;
  state = {} as S;
  __host?: {
    __setLogicState(update: StateUpdate<S>, callback?: () => void): void;
    forceUpdate(callback?: () => void): void;
  };

  constructor(props?: P) {
    this.props = props || ({} as P);
  }

  setState(update: StateUpdate<S>, callback?: () => void): void {
    this.__host && this.__host.__setLogicState(update, callback);
  }

  forceUpdate(callback?: () => void): void {
    this.__host && this.__host.forceUpdate(callback);
  }

  componentDidMount(): void {}
  componentDidUpdate(_prevProps: unknown): void {}
  componentWillUnmount(): void {}
  renderVals(): Record<string, unknown> { return {}; }
}
