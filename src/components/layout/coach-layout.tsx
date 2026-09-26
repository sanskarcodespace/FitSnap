"use client"
import { AppShell, type AppShellProps } from "./app-shell"
export type CoachLayoutProps = Omit<AppShellProps, "role">
export function CoachLayout(props: CoachLayoutProps) { return <AppShell {...props} role="coach" /> }
