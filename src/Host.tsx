import { Component } from 'react';
import { type StateUpdate } from './logic/DCLogic';
import { LabLogic } from './logic/LabLogic';
import { defaultProps, type LabProps } from './props';
import { GeneratedRoot } from './ui/generated/Root';

type HostProps = Partial<LabProps>;
type HostState = { version: number };

declare global {
  interface Window {
    __lab?: LabLogic;
  }
}

export class Host extends Component<HostProps, HostState> {
  readonly logic: LabLogic;

  constructor(props: HostProps) {
    super(props);
    this.state = { version: 0 };
    this.logic = new LabLogic({ ...defaultProps, ...props });
    this.logic.__host = this;
    window.__lab = this.logic;
  }

  componentDidMount(): void {
    this.logic.componentDidMount();
  }

  componentDidUpdate(prevProps: Readonly<HostProps>): void {
    const previous = { ...defaultProps, ...prevProps };
    this.logic.props = { ...defaultProps, ...this.props };
    (this.logic.componentDidUpdate as (prevProps: unknown) => void)(previous);
  }

  componentWillUnmount(): void {
    this.logic.componentWillUnmount();
  }

  __setLogicState(update: StateUpdate<LabLogic['state']>, callback?: () => void): void {
    const current = this.logic.state;
    const patch = typeof update === 'function' ? update(current) : update;
    this.logic.state = { ...current, ...(patch || {}) };
    this.forceUpdate(callback);
  }

  render() {
    return <GeneratedRoot vals={this.logic.renderVals()} />;
  }
}
