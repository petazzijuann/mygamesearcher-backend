import { BadRequestException } from '@nestjs/common';
import { FindOptionsWhere, In, Repository } from 'typeorm';

// Busca varias entidades por id y responde 400 indicando cuáles no existen.
// nombre se usa en el mensaje, por ejemplo "las plataformas" -> "No existen las plataformas con id: 7, 9"
export async function buscarPorIds<T extends { id: number }>(
  repositorio: Repository<T>,
  ids: number[],
  nombre: string,
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }
  const encontrados = await repositorio.findBy({
    id: In(ids),
  } as FindOptionsWhere<T>);
  const faltantes = ids.filter(
    (id) => !encontrados.some((entidad) => entidad.id === id),
  );
  if (faltantes.length > 0) {
    throw new BadRequestException(
      `No existen ${nombre} con id: ${faltantes.join(', ')}`,
    );
  }
  return encontrados;
}
