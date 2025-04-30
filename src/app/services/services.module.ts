import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AiSuggestionsService } from './ai-suggestions.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    AiSuggestionsService
  ]
})
export class ServicesModule {} 