FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY PersonalTrainer.slnx ./
COPY src/PersonalTrainer.Domain/PersonalTrainer.Domain.csproj src/PersonalTrainer.Domain/
COPY src/PersonalTrainer.Application/PersonalTrainer.Application.csproj src/PersonalTrainer.Application/
COPY src/PersonalTrainer.Infrastructure/PersonalTrainer.Infrastructure.csproj src/PersonalTrainer.Infrastructure/
COPY src/PersonalTrainer.Api/PersonalTrainer.Api.csproj src/PersonalTrainer.Api/
RUN dotnet restore src/PersonalTrainer.Api/PersonalTrainer.Api.csproj

COPY src/ src/
RUN dotnet publish src/PersonalTrainer.Api/PersonalTrainer.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "PersonalTrainer.Api.dll"]
