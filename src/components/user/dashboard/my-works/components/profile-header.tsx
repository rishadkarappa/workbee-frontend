// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Camera, Calendar, Mail, MapPin } from "lucide-react";

// export default function ProfileHeader() {
//   return (
//     <Card>
//       <CardContent className="p-6">
//         <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
//           <div className="relative">
//             <Avatar className="h-24 w-24">
//               <AvatarImage src="https://bundui-images.netlify.app/avatars/08.png" alt="Profile" />
//               <AvatarFallback className="text-2xl">JD</AvatarFallback>
//             </Avatar>
//             <Button
//               size="icon"
//               variant="outline"
//               className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full">
//               <Camera />
//             </Button>
//           </div>
//           <div className="flex-1 space-y-2">
//             <div className="flex flex-col gap-2 md:flex-row md:items-center">
//               <h1 className="text-2xl font-bold">John Doe</h1>
//               <Badge variant="secondary">Pro Member</Badge>
//             </div>
//             <p className="text-muted-foreground">Senior Product Designer</p>
//             <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
//               <div className="flex items-center gap-1">
//                 <Mail className="size-4" />
//                 john.doe@example.com
//               </div>
//               <div className="flex items-center gap-1">
//                 <MapPin className="size-4" />
//                 San Francisco, CA
//               </div>
//               <div className="flex items-center gap-1">
//                 <Calendar className="size-4" />
//                 Joined March 2023
//               </div>
//             </div>
//           </div>
//           <Button variant="default">Edit Profile</Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

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