"use client"
import { AppShell, type AppShellProps } from "./app-shell"
export type IndividualLayoutProps = Omit<AppShellProps, "role">
export function IndividualLayout(props: IndividualLayoutProps) { return <AppShell {...props} role="individual" /> }
