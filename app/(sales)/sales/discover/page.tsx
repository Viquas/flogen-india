import { requireSales } from '@/lib/auth/require-sales'
import { DiscoverPanel } from '@/components/sales/discover-panel'

export default async function SalesDiscoverPage() {
    // Gate the page; the server action re-checks on submit.
    await requireSales()

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Discover leads</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Pick an area and a business type. Callable leads land straight in your workspace —
                    no lists to export.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <DiscoverPanel />
            </div>
        </div>
    )
}
