// MIT © 2017 azu
import { UseCase } from "almin";
import { DUseCase } from "./DUseCase"

export class AUseCase extends UseCase {
    execute() {
        return this.context.useCase(new DUseCase()).execute();
    }
}