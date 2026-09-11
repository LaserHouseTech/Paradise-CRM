import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';

export default function Page() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodos() {
      try {
        const { data } = await supabase.from('todos').select('*');
        if (data) setTodos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTodos();
  }, []);

  if (loading) return <div>Carregando dados do Supabase...</div>;

  return (
    <div className="p-6 text-white bg-neutral-900 rounded-xl">
      <h2 className="text-lg font-bold mb-4">Itens Supabase</h2>
      {todos.length === 0 ? (
        <p className="text-neutral-400 text-sm">Nenhum registro encontrado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="text-sm bg-neutral-800 p-2 rounded">
              {todo.name || todo.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
