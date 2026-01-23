export interface ResumeData {
    cv: {
        name: string;
        sections: {
            summary: string[];
            skills: SkillGroup[];
            experience: Experience[];
            education: Education[];
        };
    };
}

export interface SkillGroup {
    label: string;
    details: string;
}

export interface Experience {
    company: string;
    location: string;
    position: string;
    start_date: string;
    end_date?: string;
    summary?: string;
    highlights?: string[];
}

export interface Education {
    institution: string;
    area: string;
    degree: string;
    end_date: string;
    summary?: string;
    highlights?: EducationHighlight[];
}

export interface EducationHighlight {
    organization: string,
    details: string,
}