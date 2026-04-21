'use client'

import React from 'react'
import { useFormBuilder } from '@/lib/store/form-builder'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Download } from 'lucide-react'
import { serializeFormData } from '@/lib/utils'

export const FormPreviewPanel = React.memo(function FormPreviewPanel() {
  const { form } = useFormBuilder()
  const jsonString = serializeFormData(form)

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString)
  }

  const handleDownloadJson = () => {
    const element = document.createElement('a')
    const file = new Blob([jsonString], { type: 'application/json' })
    element.href = URL.createObjectURL(file)
    element.download = `${form.name}-schema.json`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Form Schema</h3>
        <p className="text-xs text-muted-foreground">
          View and export your form structure
        </p>
      </div>

      <Tabs defaultValue="json" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="flex-1 flex flex-col space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyJson}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadJson}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          <div className="flex-1 bg-muted rounded-lg p-3 overflow-auto font-mono text-xs">
            <pre className="whitespace-pre-wrap break-words">{jsonString}</pre>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="flex-1 overflow-auto space-y-3">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Name:</span> {form.name}
            </div>
            {form.description && (
              <div className="text-sm">
                <span className="font-semibold">Description:</span> {form.description}
              </div>
            )}
            <div className="text-sm">
              <span className="font-semibold">Fields:</span> {form.fields.length}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Updated:</span>{' '}
              {new Date(form.updatedAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Fields</h4>
            <div className="space-y-1">
              {form.fields.map((field) => (
                <div key={field.id} className="text-xs bg-muted p-2 rounded">
                  <div className="font-medium">{field.label || 'Untitled'}</div>
                  <div className="text-muted-foreground">
                    {field.type}
                    {field.required && ' • Required'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
})
