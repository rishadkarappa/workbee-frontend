import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Calendar, Mail, MapPin } from "lucide-react";

export default function ProfileHeader() {
  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
              <AvatarImage
                src="https://bundui-images.netlify.app/avatars/08.png"
                alt="Profile"
              />
              <AvatarFallback className="bg-muted text-2xl text-muted-foreground">
                JD
              </AvatarFallback>
            </Avatar>

            <Button
              size="icon"
              variant="outline"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-border bg-background shadow-sm"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Information */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                John Doe
              </h1>

              <Badge variant="secondary" className="w-fit">
                Pro Member
              </Badge>
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              Senior Product Designer
            </p>

            <Separator className="max-w-xl" />

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>john.doe@example.com</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>San Francisco, CA</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Joined March 2023</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button className="w-full shrink-0 sm:w-auto">
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}