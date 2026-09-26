"use client"
import { AppShell, type AppShellProps } from "./app-shell"
export type ClientLayoutProps = Omit<AppShellProps, "role">
export function ClientLayout(props: ClientLayoutProps) { return <AppShell {...props} role="client" /> }
