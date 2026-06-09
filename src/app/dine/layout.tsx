import "./dine.css";

export const metadata = {
  title: "Dine — Rooster's Den",
};

export default function DineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
