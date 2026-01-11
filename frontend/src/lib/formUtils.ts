export function cleanFormData<T extends Record<string, any>>(data: T): Partial<T> {
    const cleaned: Record<string, any> = {};

    Object.keys(data).forEach(key => {
        const value = data[key];
        // Convert empty strings to undefined so backend validation (IsOptional) works
        if (value === '') {
            cleaned[key] = undefined;
        } else {
            cleaned[key] = value;
        }
    });

    return cleaned as Partial<T>;
}
