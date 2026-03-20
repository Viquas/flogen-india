export default function DashboardContentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            {children}
        </div>
    )
}
