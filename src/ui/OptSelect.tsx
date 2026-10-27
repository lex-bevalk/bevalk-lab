import { cloneElement, useEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactElement } from 'react';
import { Icon } from './Icon';

type Option = { label: string; selected: boolean; pick: () => void };
type Trigger = ReactElement<ComponentPropsWithoutRef<'button'> & { 'data-open'?: string }>;
type OptSelectProps = { vals: any; target: string; children: Trigger };

export function OptSelect({ vals, target, children }: OptSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const options: Option[] = vals.sheet?.opts || [];
  const open = Boolean(vals.sheet?.hasOpts && vals.sheet.target === target);
  const selectedIndex = options.findIndex(option => option.selected);
  const [cursor, setCursor] = useState(selectedIndex);
  const wasOpen = useRef(false);
  const menuId = `lab-optsel-${target}-listbox`;

  useEffect(() => {
    if (open && !wasOpen.current) {
      setCursor(selectedIndex);
      menuRef.current?.scrollIntoView({ block: 'nearest' });
    }
    if (!open && wasOpen.current) {
      const wrapper = wrapperRef.current;
      const active = document.activeElement;
      if (active === document.body || (active && wrapper?.contains(active))) {
        wrapper?.querySelector<HTMLButtonElement>(':scope > button')?.focus();
      }
    }
    wasOpen.current = open;
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) vals.sheet.close();
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [open, vals.sheet]);

  const originalClick = children.props.onClick;
  const originalKeyDown = children.props.onKeyDown;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    originalKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setCursor(selectedIndex);
        originalClick?.(event as unknown as ReactMouseEvent<HTMLButtonElement>);
        return;
      }
      if (options.length) {
        setCursor(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      }
    } else if (open && event.key === 'Home') {
      event.preventDefault();
      if (options.length) setCursor(0);
    } else if (open && event.key === 'End') {
      event.preventDefault();
      if (options.length) setCursor(options.length - 1);
    } else if (open && (event.key === 'Enter' || event.key === ' ') && options[cursor]) {
      event.preventDefault();
      options[cursor].pick();
    }
  };

  const trigger = cloneElement(children, {
    className: [children.props.className, 'lab-optsel__trigger'].filter(Boolean).join(' '),
    role: 'combobox',
    'aria-haspopup': 'listbox',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    'aria-activedescendant': open && cursor >= 0 && cursor < options.length ? `${menuId}-option-${cursor}` : undefined,
    'data-open': open ? 'true' : 'false',
    onKeyDown,
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (open) vals.sheet.close();
      else originalClick?.(event);
    },
  });

  return (
    <div ref={wrapperRef} className="lab-optsel" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {trigger}
      {open && (
        <div ref={menuRef} className="odin-menu" role="listbox" id={menuId} aria-label={vals.sheet.title}>
          {options.map((option, index) => (
            <button
              key={`${target}-${index}`}
              id={`${menuId}-option-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              className="odin-menu__item"
              aria-selected={Boolean(option.selected)}
              data-active={index === cursor ? 'true' : undefined}
              onMouseEnter={() => setCursor(index)}
              onClick={() => option.pick()}
            >
              {option.label}
              {option.selected && <Icon data-icon="check" data-size="16" className="odin-menu__check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
