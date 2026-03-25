import { getClients } from './actions'
import { ClientsList } from './clients-list'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
    const result = await getClients()
    const clients = result.success ? (result.data ?? []) : []

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Purchased clients and their fulfillment status
                </p>
            </div>
            <ClientsList initialClients={clients} />
        </div>
    )
}
