'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Undo2, Redo2, Settings, Eye, Globe, EyeOff,
  CheckCircle, AlertCircle, Loader2, MoreHorizontal,
  LayoutDashboard, LogOut, User,
} from 'lucide-react'
import type { SaveStatus } from '@/hooks/use-form-builder'

export interface BuilderHeaderProps {
  formName: string
  onNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onPreview: () => void
  settingsContent: React.ReactNode
  saveStatus?: SaveStatus
  isPublished?: boolean
  onPublishToggle?: () => void
  // User actions
  userName?: string | null
  onDashboard?: () => void
  onSignOut?: () => void
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap" aria-live="polite">
      {status === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />Saving…</>}
      {status === 'saved' && <><CheckCircle className="h-3 w-3 text-green-500" aria-hidden="true" />Saved</>}
      {status === 'error' && <><AlertCircle className="h-3 w-3 text-destructive" aria-hidden="true" />Failed</>}
    </span>
  )
}

export const BuilderHeader = React.memo(function BuilderHeader({
  formName,
  onNameChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPreview,
  settingsContent,
  saveStatus = 'idle',
  isPublished = false,
  onPublishToggle,
  userName,
  onDashboard,
  onSignOut,
}: BuilderHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="border-b px-4 sm:px-6 py-3 sm:py-4">

      {/* ── Desktop layout (≥ sm) ── */}
      <div className="hidden sm:flex items-center gap-2">
        {/* Form name + save status */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Label htmlFor="builder-form-name-desktop" className="sr-only">Form name</Label>
          <Input
            id="builder-form-name-desktop"
            value={formName}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-xl font-bold border-transparent bg-transparent focus-visible:border focus-visible:bg-background"
            placeholder="Untitled Form"
            aria-label="Form name"
          />
          <SaveIndicator status={saveStatus} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button size="sm" variant="outline" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Y)">
            <Redo2 className="h-4 w-4" aria-hidden="true" />
          </Button>

          {onPublishToggle && (
            <Button size="sm" variant={isPublished ? 'default' : 'outline'} onClick={onPublishToggle}
              aria-label={isPublished ? 'Unpublish form' : 'Publish form'}>
              {isPublished
                ? <><Globe className="h-4 w-4 mr-1" aria-hidden="true" />Published</>
                : <><EyeOff className="h-4 w-4 mr-1" aria-hidden="true" />Publish</>}
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} aria-label="Open form settings">
            <Settings className="h-4 w-4 mr-1" aria-hidden="true" />
            Settings
          </Button>

          <Button size="sm" variant="default" onClick={onPreview} aria-label="Preview form">
            <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
            Preview
          </Button>

          {/* Desktop user menu */}
          {(onDashboard || onSignOut) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" aria-label="User menu">
                  <User className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {userName && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{userName}</div>
                    <DropdownMenuSeparator />
                  </>
                )}
                {onDashboard && (
                  <DropdownMenuItem onClick={onDashboard}>
                    <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                {onSignOut && (
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Mobile layout (< sm) ── */}
      <div className="sm:hidden space-y-2">
        {/* Row 1: undo/redo | preview + overflow */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="outline" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
              <Redo2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="default" onClick={onPreview} aria-label="Preview form">
              <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
              Preview
            </Button>

            {/* Mobile overflow menu — everything else */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {onPublishToggle && (
                  <DropdownMenuItem onClick={onPublishToggle}>
                    {isPublished
                      ? <><EyeOff className="h-4 w-4 mr-2" aria-hidden="true" />Unpublish</>
                      : <><Globe className="h-4 w-4 mr-2" aria-hidden="true" />Publish</>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                  Settings
                </DropdownMenuItem>

                {(onDashboard || onSignOut) && <DropdownMenuSeparator />}

                {userName && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{userName}</div>
                )}
                {onDashboard && (
                  <DropdownMenuItem onClick={onDashboard}>
                    <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                {onSignOut && (
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: full-width form name */}
        <div className="flex items-center gap-2">
          <Label htmlFor="builder-form-name-mobile" className="sr-only">Form name</Label>
          <Input
            id="builder-form-name-mobile"
            value={formName}
            onChange={(e) => onNameChange(e.target.value)}
            className="flex-1 text-lg font-bold border-transparent bg-transparent focus-visible:border focus-visible:bg-background"
            placeholder="Untitled Form"
            aria-label="Form name"
          />
          <SaveIndicator status={saveStatus} />
        </div>
      </div>

      {/* Settings sheet — shared */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-full sm:w-96 p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>Form Settings</SheetTitle>
            <SheetDescription>Configure your form settings</SheetDescription>
          </SheetHeader>
          {settingsContent}
        </SheetContent>
      </Sheet>
    </header>
  )
})
