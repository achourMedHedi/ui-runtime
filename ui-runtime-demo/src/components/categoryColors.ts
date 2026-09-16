export const categoryColors: Record<string, string> = {
    Electronics: "#2563eb",
    Clothing: "#7c3aed",
    Food: "#059669",
    Other: "#6b7280",
}

export const getCategoryColor = (category: string) => categoryColors[category] ?? "#6b7280"
