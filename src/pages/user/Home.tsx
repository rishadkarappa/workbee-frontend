import { Button } from "@/components/ui/button";
import Navbar from "@/components/user/navbar";
import { useNavigate } from "react-router-dom";
import { AuthHelper } from "@/utils/auth-helper";
import { AppRoutes } from "@/constants/routes/app-routes";
import { toast } from "sonner";
import Stack from "@/components/Stack";

// hero imgs
import heroOne from '@/assets/hero/hero.moving.one.webp';
import heroTwo from '@/assets/hero/hero.cleaning.two.webp';
import heroThree from '@/assets/hero/hero.three.gardening.webp';
import heroFour from '@/assets/hero/hero.four.furnitureAssemply.jpg';
import heroFive from '@/assets/hero/hero.five.carwash.jpg';

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
      navigate('/login')
      toast.warning("Loggin first")
    } else {
      navigate(AppRoutes.USER.TASK_BOOKING)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="relative ml-50 flex items-center min-h-[calc(100vh-95px)] px-6 max-w-7xl mx-auto">
        <div className="flex-1 max-w-md mx-auto mr-25">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">
              Assign your Work
              <br />
              to someone in just
              <br />
              90 seconds.
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              No more stress, no more
              <br />
              waiting.
            </p>

            {/* Post Work button */}
            <Button
              onClick={handleNavigate}
              className="bg-primary rounded-full text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base"
            >
              Post your work
            </Button>

            {/* Find a Worker button */}
            {/* <Button
              onClick={handleNavigate}
              className="bg-white text-black rounded-full ml-2 hover:bg-gray-100 border border-gray-300 px-6 py-3 text-base"
            >
              Find a Worker
            </Button> */}
          </div>
        </div>

        {/* icons */}
        <div className="flex-1 right-50">
          <div style={{ width: 370, height: 220 }}>
            <Stack
              randomRotation={false}
              sensitivity={200}
              sendToBackOnClick={true}
              cards={images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`card-${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ))}
              autoplay={false}
              autoplayDelay={3000}
              pauseOnHover={false}
            />
          </div>
        </div>


      </main>
    </div>
  );
}
