import { supabase } from '../config/supabaseClient.js';

export const buscarLojas = async (req, res) => {
    const { data, error } = await supabase
        .from('lojas')
        .select('*');

    if (error) {
        console.error('Erro ao buscar lojas:', error);
        return res.status(500).json({ error: 'Erro ao buscar lojas.' });
    }

    res.json(data);
};

