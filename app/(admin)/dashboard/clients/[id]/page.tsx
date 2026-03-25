import { redirect } from 'next/navigation'
import { getClientDetail } from '../actions'
import { ClientDetail } from './client-detail'

interface ClientDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
    const { id } = await params
    const result = await getClientDetail(id)

    if (!result.success || !result.data) {
        redirect('/dashboard/clients')
    }

    return (
        <ClientDetail
            client={result.data.client}
            requests={result.data.requests}
        />
    )
}
