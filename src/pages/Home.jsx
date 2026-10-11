import Hero from "../sections/Hero";
import Features from "../sections/Features";
import Categories from "../sections/Categories";
import Trending from "../sections/Trending";
import BestSellers from "../sections/BestSellers";
import NewArrivals from "../sections/NewArrivals";
import LimitedOffer from "../sections/LimitedOffer";
import Reviews from "../sections/Reviews";
import BrandShowcase from "../sections/BrandShowcase";
import Newsletter from "../sections/Newsletter";
import PersonalizedSection, { RecentlyViewed } from "../sections/Personalized";

export default function Home() {
  return (
    <div className="pb-24">
      <Hero />
      <Features />
      <Categories />
      <Trending />
      <BestSellers />
      <LimitedOffer />
      <NewArrivals />
      <PersonalizedSection />
      <RecentlyViewed />
      <Reviews />
      <BrandShowcase />
      <Newsletter />
    </div>
  );
}
