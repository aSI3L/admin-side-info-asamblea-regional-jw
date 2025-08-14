import * as React from "react"
import { Switch as ShadcnSwitch } from "@radix-ui/react-switch"

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof ShadcnSwitch> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}

export function Switch({ checked, onCheckedChange, label, ...props }: SwitchProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <ShadcnSwitch
        checked={checked}
        onCheckedChange={onCheckedChange}
        {...props}
        style={{ width: 40, height: 20, background: checked ? '#4ade80' : '#e5e7eb', borderRadius: 9999, position: 'relative', transition: 'background 0.2s' }}
      >
        <span
          style={{
            display: 'block',
            width: 18,
            height: 18,
            background: '#fff',
            borderRadius: '50%',
            position: 'absolute',
            left: checked ? 20 : 2,
            top: 1,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />
      </ShadcnSwitch>
      {label && <span>{label}</span>}
    </label>
  )
}
