const supabase = require('../config/supabaseClient');

const buscarLojas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lojas')
            .select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar lojas.' });
    }
};

module.exports = {
    buscarLojas,
};