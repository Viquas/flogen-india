export interface ProjectHistoryItem {
    id: string;
    name: string;
    industry: string;
    date?: string;
    month?: string;
    data: any;
    status?: string;
    timestamp?: string;
    generated_code?: string;
}

export interface Template {
    id: string;
    name: string;
    code: string;
    rating: number; // 1, 2, or 3
    timestamp: string;
    industry: string;
}

export const MOCK_TEMPLATES: Template[] = [];

export const MOCK_PROJECT_HISTORY: ProjectHistoryItem[] = [
    {
        id: "1",
        name: "Dental Care Plus",
        industry: "Dentists",
        date: "February 1",
        month: "March",
        data: {
            businessName: "Dental Care Plus",
            description: "Providing quality dental services for the whole family.",
            services: ["Teeth Whitening", "Root Canal", "Cleaning"],
            contactInfo: { email: "info@dentalcare.com", phone: "555-0101" }
        }
    },
    {
        id: "2",
        name: "Happy Smiles",
        industry: "Dentists",
        date: "February 1",
        month: "March",
        data: {
            businessName: "Happy Smiles",
            description: "Your smile is our priority.",
            services: ["Checkups", "Braces", "Invisalign"],
            contactInfo: { email: "contact@happysmiles.com", phone: "555-0102" }
        }
    },
    {
        id: "3",
        name: "Auto Fix Pro",
        industry: "Automobile",
        date: "February 2",
        month: "March",
        data: {
            businessName: "Auto Fix Pro",
            description: "Expert auto repair services.",
            services: ["Engine Repair", "Tire Change", "Oil Change"],
            contactInfo: { email: "fix@autopro.com", phone: "555-0103" }
        }
    },
    {
        id: "4",
        name: "Speedy Wheels",
        industry: "Automobile",
        date: "February 2",
        month: "March",
        data: {
            businessName: "Speedy Wheels",
            description: "Fast and reliable car maintenance.",
            services: ["Brake Check", "Alignment", "Battery Service"],
            contactInfo: { email: "service@speedywheels.com", phone: "555-0104" }
        }
    },
    {
        id: "5",
        name: "FinTech Hub",
        industry: "Fintech",
        date: "February 3",
        month: "March",
        data: {
            businessName: "FinTech Hub",
            description: "Innovative financial solutions for businesses.",
            services: ["Payments", "API Integration", "Security"],
            contactInfo: { email: "support@fintechhub.com", phone: "555-0105" }
        }
    }
];
