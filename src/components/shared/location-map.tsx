export function LocationMap({ address }: { address: string }) {
    if (!address.trim()) return <p className="mt-5 text-sm text-muted-foreground">Chưa có địa điểm để hiển thị bản đồ.</p>;
    const query = encodeURIComponent(`${address}, Việt Nam`);
    return <div className="mt-5 overflow-hidden rounded-xl border border-primary/10 bg-secondary/30">
        <iframe
            title={`Bản đồ địa điểm làm việc: ${address}`}
            src={`https://www.google.com/maps?q=${query}&hl=vi&z=14&output=embed`}
            className="h-64 w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
        />
        <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center px-3 py-2 text-center text-xs font-medium text-primary hover:bg-secondary">Mở Google Maps để xem đường đi →</a>
    </div>;
}
