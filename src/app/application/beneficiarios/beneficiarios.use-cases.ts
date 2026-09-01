import { Inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  BeneficiarioDetalhe,
  BeneficiarioResumo,
} from '../../domain/beneficiarios/beneficiario.model';
import { BENEFICIARIOS_API, type BeneficiariosApiPort } from './beneficiarios-api.port';
import type {
  AdmitirBeneficiarioInput,
  AlterarGrupoInput,
  BeneficiarioFiltro,
  DesligarBeneficiarioInput,
} from './beneficiarios.models';
@Injectable()
export class BuscarBeneficiariosUseCase {
  constructor(@Inject(BENEFICIARIOS_API) private readonly api: BeneficiariosApiPort) {}
  execute(f: BeneficiarioFiltro): Observable<BeneficiarioResumo[]> {
    return this.api.listar(f);
  }
}
@Injectable()
export class ObterBeneficiarioUseCase {
  constructor(@Inject(BENEFICIARIOS_API) private readonly api: BeneficiariosApiPort) {}
  execute(id: string): Observable<BeneficiarioDetalhe> {
    return this.api.obter(id);
  }
}
@Injectable()
export class AdmitirBeneficiarioUseCase {
  constructor(@Inject(BENEFICIARIOS_API) private readonly api: BeneficiariosApiPort) {}
  execute(i: AdmitirBeneficiarioInput) {
    return this.api.admitir(i);
  }
}
@Injectable()
export class AlterarGrupoBeneficiarioUseCase {
  constructor(@Inject(BENEFICIARIOS_API) private readonly api: BeneficiariosApiPort) {}
  execute(id: string, i: AlterarGrupoInput) {
    return this.api.alterarGrupo(id, i);
  }
}
@Injectable()
export class DesligarBeneficiarioUseCase {
  constructor(@Inject(BENEFICIARIOS_API) private readonly api: BeneficiariosApiPort) {}
  execute(id: string, i: DesligarBeneficiarioInput) {
    return this.api.desligar(id, i);
  }
}
@Injectable()
export class ReativarBeneficiarioUseCase {
  constructor(@Inject(BENEFICIARIOS_API) private readonly api: BeneficiariosApiPort) {}
  execute(id: string) {
    return this.api.reativar(id);
  }
}
