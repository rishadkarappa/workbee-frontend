
// export default function WorkerAccountSettings() {
//   return (
//     <div>
//       <h1>Worker Account Settings</h1>
//     </div>
//   )
// }


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export default function WorkerAccountSettings() {
  return (
    <div className="container max-w-4xl py-10 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="space-y-0.5 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your public avatar, personal bio, and notification settings.
        </p>
      </div>
      <Separator className="my-6" />

      <div className="grid gap-8 md:grid-cols-[1fr_250px] items-start">
        {/* Main Forms Section */}
        <div className="space-y-6">
          {/* Personal Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>
                This information will be displayed publicly to other users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" defaultValue="Alex" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" defaultValue="Morgan" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="alexmorgan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us a little bit about yourself..." 
                  className="min-h-[100px] resize-none"
                  defaultValue="Full Stack Developer passionate about responsive layouts and component architecture."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Configure how you want to interact with the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="public-profile">Public visibility</Label>
                  <p className="text-sm text-muted-foreground">Allow search engines to index your profile.</p>
                </div>
                <Switch id="public-profile" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly updates about community activity.</p>
                </div>
                <Switch id="email-notifications" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Avatar Panel */}
        <Card className="md:sticky md:top-6 order-first md:order-last">
          <CardHeader className="text-center">
            <CardTitle className="text-sm font-medium">Profile Image</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://unsplash.com" alt="Avatar" />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
            <div className="flex flex-col w-full gap-2">
              <Button variant="outline" size="sm" className="w-full">
                Upload image
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
