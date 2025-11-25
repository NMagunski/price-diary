export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold">
          PriceDiary
        </h1>
        <p className="mb-4 text-center text-sm text-slate-600">
          Въведи продукт и цена, за да започнеш своя дневник на цените.
        </p>
        {/* Тук по-късно ще сложим PriceEntryForm */}
      </div>
    </main>
  );
}
