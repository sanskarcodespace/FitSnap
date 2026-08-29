"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Radio } from "@/components/ui/radio"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Alert } from "@/components/ui/alert"
import { Modal } from "@/components/ui/modal"
import { Toast } from "@/components/ui/toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProgressBar, ProgressRing } from "@/components/ui/progress"
import { Skeleton, Spinner, EmptyState } from "@/components/ui/states"
import { Tooltip } from "@/components/ui/tooltip"
import { DataTable } from "@/components/ui/data-table"
import { TrendChart } from "@/components/ui/trend-chart"
import { Search, Info, Plus } from "lucide-react"

export default function StyleGuidePage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("tab1")
  
  const sampleData = [
    { id: "1", name: "Alice", email: "alice@example.com", role: "Coach", status: "Active" },
    { id: "2", name: "Bob", email: "bob@example.com", role: "Client", status: "Active" },
    { id: "3", name: "Charlie", email: "charlie@example.com", role: "Client", status: "Inactive" },
  ]

  return (
    <div className="container mx-auto p-8 space-y-16 pb-24">
      <div>
        <h1 className="text-[var(--text-display-size)] font-bold mb-4">Design System & Component Library</h1>
        <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-500)]">Internal style guide for FitSnap tokens and components.</p>
      </div>

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-[var(--color-primary-700)] shadow-sm"></div>
            <div className="text-sm font-medium">Primary</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-[var(--color-secondary-500)] shadow-sm"></div>
            <div className="text-sm font-medium">Secondary</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-[var(--color-success-bg)] text-[var(--color-success-text)] flex items-center justify-center font-bold shadow-sm">Success</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-[var(--color-error-bg)] text-[var(--color-error-text)] flex items-center justify-center font-bold shadow-sm">Error</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-[var(--color-macro-calories)] flex items-center justify-center text-white shadow-sm font-medium">Calories</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-[var(--color-macro-protein)] flex items-center justify-center text-white shadow-sm font-medium">Protein</div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Typography</h2>
        <div className="space-y-4">
          <div className="text-[var(--text-display-size)] leading-[var(--text-display-line-height)] font-bold">Display Text</div>
          <div className="text-[var(--text-h1-size)] leading-[var(--text-h1-line-height)] font-bold">Heading 1</div>
          <div className="text-[var(--text-h2-size)] leading-[var(--text-h2-line-height)] font-semibold">Heading 2</div>
          <div className="text-[var(--text-h3-size)] leading-[var(--text-h3-line-height)] font-semibold">Heading 3</div>
          <div className="text-[var(--text-h4-size)] leading-[var(--text-h4-line-height)] font-medium">Heading 4</div>
          <div className="text-[var(--text-body-lg-size)] leading-[var(--text-body-lg-line-height)]">Body Large: The quick brown fox jumps over the lazy dog.</div>
          <div className="text-[var(--text-body-size)] leading-[var(--text-body-line-height)]">Body Regular: The quick brown fox jumps over the lazy dog.</div>
          <div className="text-[var(--text-body-sm-size)] leading-[var(--text-body-sm-line-height)]">Body Small: The quick brown fox jumps over the lazy dog.</div>
          <div className="text-[var(--text-caption-size)] leading-[var(--text-caption-line-height)] text-[var(--color-neutral-500)]">Caption: The quick brown fox jumps over the lazy dog.</div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button leadingIcon={<Search className="w-4 h-4" />}>With Icon</Button>
          <Button isLoading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Inputs & Forms</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="m@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="error-input">With Error</Label>
            <Input id="error-input" error="This field is required." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="select">Select Plan</Label>
            <Select id="select">
              <option>Free Plan</option>
              <option>Pro Plan</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself..." />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Radio id="r1" name="radio" defaultChecked />
              <Label htmlFor="r1">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Radio id="r2" name="radio" />
              <Label htmlFor="r2">Option 2</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>
        </div>
      </section>

      {/* Cards & Badges */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Cards, Badges & Avatars</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Coach Dashboard</CardTitle>
              <CardDescription>Overview of your clients and earnings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar initials="JD" />
                  <div>
                    <p className="font-medium text-sm">John Doe</p>
                    <p className="text-sm text-neutral-500">Client</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">View Details</Button>
            </CardFooter>
          </Card>
          
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex gap-4 items-center pt-4">
              <Avatar size="sm" initials="S" />
              <Avatar size="md" initials="M" />
              <Avatar size="lg" initials="L" />
              <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" />
            </div>
          </div>
        </div>
      </section>

      {/* Feedback: Alerts, Toasts, Modals */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Feedback & Overlays</h2>
        <div className="space-y-4 max-w-2xl">
          <Alert title="Note">This is a default alert for general information.</Alert>
          <Alert variant="error" title="Payment Failed">There was an issue processing your payment.</Alert>
          <Alert variant="success" title="Workout Logged">Your workout was saved successfully.</Alert>

          <div className="pt-4 space-y-4">
            <Toast title="Item archived" description="The meal plan has been moved to archives." />
            <Toast variant="error" title="Connection error" description="Could not connect to the server." />
          </div>

          <div className="pt-4 flex gap-4">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)}
              title="Delete Client?"
              description="This action cannot be undone. All data will be permanently removed."
              footer={
                <>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => setIsModalOpen(false)}>Delete</Button>
                </>
              }
            >
              <p className="text-sm text-neutral-600">Are you absolutely sure you want to delete this client's profile and all associated data?</p>
            </Modal>

            <Tooltip content="Provides extra context">
              <Button variant="secondary" leadingIcon={<Info className="w-4 h-4" />}>Hover me</Button>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Navigation & Layout */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Navigation (Tabs)</h2>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Overview</TabsTrigger>
            <TabsTrigger value="tab2">Meals</TabsTrigger>
            <TabsTrigger value="tab3">Workouts</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div className="p-4 border rounded-md mt-2">Overview Content</div>
          </TabsContent>
          <TabsContent value="tab2">
            <div className="p-4 border rounded-md mt-2">Meals Content</div>
          </TabsContent>
          <TabsContent value="tab3">
            <div className="p-4 border rounded-md mt-2">Workouts Content</div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Trend Chart */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Data Visualization</h2>
        <Card>
          <CardHeader>
            <CardTitle>Trend Chart (Calories)</CardTitle>
            <CardDescription>Reusable component for plotting historical data with a target line.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <TrendChart 
                data={[
                  { date: "2023-11-01", value: 1800, isLogged: true },
                  { date: "2023-11-02", value: 1950, isLogged: true },
                  { date: "2023-11-03", value: 0, isLogged: false },
                  { date: "2023-11-04", value: 2100, isLogged: true },
                  { date: "2023-11-05", value: 1850, isLogged: true },
                  { date: "2023-11-06", value: 1900, isLogged: true },
                  { date: "2023-11-07", value: 2000, isLogged: true },
                ]}
                referenceLine={2000}
                metricColor="var(--color-macro-calories)"
                yAxisLabel="kcal"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Progress & States */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Progress & States</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500">Progress Bar (65%)</h3>
            <ProgressBar value={65} />
            <ProgressBar value={85} indicatorColor="bg-[var(--color-success-text)]" />
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <h3 className="text-sm font-medium text-neutral-500">Progress Ring</h3>
            <ProgressRing value={75} size={80} strokeWidth={8} />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500">Loading State</h3>
            <div className="flex items-center space-x-4">
              <Spinner />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 max-w-2xl">
          <EmptyState 
            icon={<Search className="w-6 h-6" />}
            title="No clients found"
            description="You haven't added any clients yet. Start by inviting someone."
            action={<Button leadingIcon={<Plus className="w-4 h-4" />}>Add Client</Button>}
          />
        </div>
      </section>

      {/* Data Table */}
      <section className="space-y-4">
        <h2 className="text-[var(--text-h2-size)] font-semibold border-b pb-2">Data Table (Responsive)</h2>
        <div className="text-sm text-neutral-500 mb-2">Resize window to see stacked mobile view vs desktop table view.</div>
        <DataTable
          data={sampleData}
          keyExtractor={(item) => item.id}
          columns={[
            { header: "Name", accessorKey: "name" },
            { header: "Email", accessorKey: "email" },
            { header: "Role", accessorKey: "role" },
            { 
              header: "Status", 
              accessorKey: "status",
              cell: (item) => (
                <Badge variant={item.status === 'Active' ? 'success' : 'secondary'}>
                  {item.status}
                </Badge>
              )
            }
          ]}
        />
      </section>

    </div>
  )
}
