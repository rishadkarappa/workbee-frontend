import { Button } from "@/components/ui/button";
import Navbar from "@/components/user/navbar";
import { useNavigate } from "react-router-dom";
import { AuthHelper } from "@/utils/auth-helper";
import { AppRoutes } from "@/constants/routes/app-routes";
import { toast } from "sonner";
import Stack from "@/components/Stack";

// Hero images
import heroOne from "@/assets/hero/hero.moving.one.webp";
import heroTwo from "@/assets/hero/hero.cleaning.two.webp";
import heroThree from "@/assets/hero/hero.three.gardening.webp";
import heroFour from "@/assets/hero/hero.four.furnitureAssemply.jpg";
import heroFive from "@/assets/hero/hero.five.carwash.jpg";

const images = [
  heroOne,
  heroTwo,
  heroThree,
  heroFour,
  heroFive,
];

export default function Login() {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (!AuthHelper.isLoggedIn()) {
      navigate("/login");
      toast.warning("Login first");
    } else {
      navigate(AppRoutes.USER.TASK_BOOKING);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto flex min-h-[calc(100vh-95px)] w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-16 xl:gap-24">

          {/* LEFT CONTENT */}
          <section className="flex justify-center md:justify-start">
            <div className="w-full max-w-xl text-center md:text-left">

              <h1
                className="
                  text-4xl
                  font-bold
                  leading-[1.08]
                  tracking-tight
                  text-foreground
                  sm:text-5xl
                  lg:text-6xl
                  xl:text-[4.25rem]
                "
              >
                Assign your Work
                <br />
                to someone in just
                <br />
                90 seconds.
              </h1>

              <p
                className="
                  mt-5
                  text-sm
                  leading-6
                  text-muted-foreground
                  sm:text-base
                  lg:text-lg
                "
              >
                No more stress, no more
                <br className="hidden sm:block" />
                waiting.
              </p>

              <div className="mt-7">
                <Button
                  onClick={handleNavigate}
                  className="
                    rounded-full
                    px-6
                    py-5
                    text-base
                    font-medium
                    shadow-sm
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >
                  Post your work
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT IMAGE STACK */}
          <section className="flex w-full justify-center md:justify-end">
            <div
              className="
                relative
                aspect-[470/320]
                w-full
                max-w-[470px]
                sm:max-w-[500px]
                lg:max-w-[520px]
                xl:max-w-[550px]
              "
            >
              <Stack
                randomRotation={false}
                sensitivity={200}
                sendToBackOnClick={true}
                cards={images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Work service ${i + 1}`}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ))}
                autoplay={true}
                autoplayDelay={3000}
                pauseOnHover={true}
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}