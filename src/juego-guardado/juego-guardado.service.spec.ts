import { Repository } from 'typeorm';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EstadoJuego } from './estado-juego.enum';
import { JuegoGuardado } from './juego-guardado.entity';
import { JuegoGuardadoService, RELACIONES } from './juego-guardado.service';

// Verifica que la biblioteca devuelva el juego completo, como lo documenta openapi.json
describe('JuegoGuardadoService (relaciones del juego)', () => {
  const find = jest.fn().mockResolvedValue([]);
  const findOne = jest.fn().mockResolvedValue({
    usuarioId: 1,
    juegoId: 2,
    estado: EstadoJuego.ME_INTERESA,
  });
  const servicio = new JuegoGuardadoService(
    { find, findOne } as unknown as Repository<JuegoGuardado>,
    {} as Repository<Usuario>,
    {} as Repository<Juego>,
  );

  it('las relaciones incluyen clasificación, plataformas, géneros y características', () => {
    expect(RELACIONES).toEqual({
      juego: {
        clasificacionEdad: true,
        plataformas: true,
        generos: true,
        caracteristicas: true,
      },
    });
  });

  it('el listado de la biblioteca pide el juego con todas sus relaciones', async () => {
    await servicio.listar(1);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ relations: RELACIONES }),
    );
  });

  it('cambiar el estado devuelve el juego con todas sus relaciones', async () => {
    const save = jest.fn();
    const conGuardar = new JuegoGuardadoService(
      { findOne, save } as unknown as Repository<JuegoGuardado>,
      {} as Repository<Usuario>,
      {} as Repository<Juego>,
    );
    await conGuardar.cambiarEstado(2, { estado: EstadoJuego.YA_JUGADO }, 1);
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ relations: RELACIONES }),
    );
  });
});
